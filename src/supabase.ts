import { SupabaseClient, createClient } from '@supabase/supabase-js'

export const create = (
  projectId: string,
  projectKey: string
): SupabaseClient => {
  const url = buildUrl(projectId)

  return createClient(url, projectKey)
}

export const buildUrl = (projectId: string): string => {
  if (!projectId.length) throw new Error('projectId must be longer than 0')
  return `https://${projectId}.supabase.co`
}

export const uploadFileToBucket = async (
  supabase: SupabaseClient,
  bucket: string,
  filename: string,
  contents: string | Buffer,
  mimeType: string
): Promise<Error | void> => {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, contents, { contentType: mimeType, upsert: true })

  if (error) return error
}
