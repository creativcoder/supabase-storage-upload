import * as core from '@actions/core'
import { create, uploadFileToBucket } from './supabase'
import { getFilenames, readFile } from './files'

import mime from 'mime-types'

/**
 * Detects the MIME type for a given file based on its name.
 * @param {string} filename - The name of the file (e.g., 'file.exe').
 * @returns {string} - The detected MIME type or 'application/octet-stream' as fallback.
 */
function getMimeType(filename: string): string {
  const mimeType = mime.lookup(filename)
  return mimeType || 'application/octet-stream'
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const repo = core.getInput('repo_directory')
    if (!repo) {
      throw new Error('repository directory is undefined')
    }
    core.debug(`repo_directory: ${repo}`)

    const directory = core.getInput('upload_directory_path')
    if (!directory) {
      throw new Error('directory is undefined')
    }
    core.debug(`upload_directory_path: ${directory}`)

    const bucket = core.getInput('bucket_name')
    if (!bucket) {
      throw new Error('bucket is undefined')
    }
    core.debug(`bucket name: ${bucket}`)

    const supabaseProjectID = process.env.SUPABASE_PROJECT_ID
    const supabaseApiKey = process.env.SUPABASE_API_KEY
    if (!supabaseProjectID || !supabaseApiKey) {
      throw new Error('Supabase credentials are undefined')
    }
    core.debug(`supabase project id: ${supabaseProjectID}`)

    const client = create(supabaseProjectID, supabaseApiKey)

    const dir = `${repo}/${directory}`
    core.debug(`dir: ${dir}`)
    const filenames = getFilenames(dir)
    if (!filenames.length) {
      core.setOutput('message', `no files in provided directory '${directory}'`)
    }

    for (const filename of filenames) {
      core.debug(`uploading: ${filename}`)
      const file = readFile(`${dir}/${filename}`)
      const mimeType = getMimeType(filename) // Detect MIME type
      core.debug(`detected MIME type: ${mimeType}`)
      const error = await uploadFileToBucket(
        client,
        bucket,
        filename,
        file,
        mimeType
      )
      if (error) {
        core.debug('an error has occurred')
        core.debug(error.message)
        core.setFailed(error.message)
        return
      }
      core.debug('file uploaded')
    }

    core.setOutput('message', 'Files uploaded successfully')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
    return
  }
}
