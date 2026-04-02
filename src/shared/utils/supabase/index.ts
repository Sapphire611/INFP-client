/**
 * Supabase HTTP 客户端
 * 用于微信小程序环境（不使用官方 SDK）
 */

import Taro from "@tarojs/taro";

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''
const APP_NUMBER = process.env.APP_NUMBER || '2'

console.log('🔍 Supabase 配置检查:')
console.log('  - SUPABASE_URL:', SUPABASE_URL ? '✅ 已设置' : '❌ 未设置')
console.log('  - SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置')
console.log('  - APP_NUMBER:', APP_NUMBER)

/**
 * 调用 Supabase Edge Function
 */
export const supabase = {
  functions: {
    invoke: async (functionName: string, options: { body?: any } = {}) => {
      const url = `${SUPABASE_URL}/functions/v1/${functionName}`

      console.log('📡 调用 Edge Function:')
      console.log('  - URL:', url)
      console.log('  - 参数:', options)

      if (!SUPABASE_URL) {
        console.error('❌ SUPABASE_URL 未设置！请检查环境变量配置')
        return { data: null, error: 'Supabase URL 未配置' }
      }

      try {
        const response = await Taro.request({
          url,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          data: options.body || {},
          timeout: 10000 // 10秒超时
        })

        console.log('✅ 响应成功:')
        console.log('  - 状态码:', response.statusCode)
        console.log('  - 响应数据:', response.data)
        console.log('  - 完整响应:', response)

        if (response.statusCode && response.statusCode >= 400) {
          console.error('❌ 请求失败:', response.data)
          return {
            data: null,
            error: response.data?.error || response.data?.message || `HTTP ${response.statusCode}`
          }
        }

        return { data: response.data, error: null }
      } catch (err: any) {
        console.error('❌ 请求异常:')
        console.error('  - 错误对象:', err)
        console.error('  - 错误码:', err.code)
        console.error('  - 错误消息:', err.errMsg)
        console.error('  - 错误数据:', err.data)
        console.error('  - 所有属性:', Object.keys(err))

        // 微信小程序错误处理
        if (err.errMsg && err.errMsg.includes('timeout')) {
          return { data: null, error: '请求超时，请重试' }
        }

        const errorMsg = err.errMsg || err.message || JSON.stringify(err) || '请求失败'
        return { data: null, error: errorMsg }
      }
    }
  },

  // 从数据库查询数据 - 支持链式调用
  from: (table: string) => {
    // 查询构建器
    const queryBuilder = {
      _filters: [] as string[],
      _select: '*' as string,

      select(columns = '*') {
        this._select = columns
        return this
      },

      eq(column: string, value: any) {
        this._filters.push(`${column}=eq.${encodeURIComponent(value)}`)
        return this
      },

      single() {
        return this
      },

      // 执行查询
      async _executeQuery() {
        let url = `${SUPABASE_URL}/rest/v1/${table}?select=${this._select}`
        if (this._filters.length > 0) {
          url += '&' + this._filters.join('&')
        }

        try {
          const response = await Taro.request({
            url,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY
            }
          })

          if (response.statusCode && response.statusCode >= 400) {
            return { data: null, error: response.data }
          }

          // 如果调用了 single()，返回单个对象而不是数组
          const data = Array.isArray(response.data) && response.data.length === 1
            ? response.data[0]
            : response.data

          return { data, error: null }
        } catch (err: any) {
          return { data: null, error: { message: err.message } }
        }
      },

      // 更新数据
      async update(data: any) {
        let url = `${SUPABASE_URL}/rest/v1/${table}`
        if (this._filters.length > 0) {
          url += '?' + this._filters.join('&')
        }

        try {
          const response = await Taro.request({
            url,
            method: 'PATCH',
            header: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            data
          })

          if (response.statusCode && response.statusCode >= 400) {
            return { data: null, error: response.data }
          }

          return { data: response.data, error: null }
        } catch (err: any) {
          return { data: null, error: { message: err.message } }
        }
      },

      // 插入数据
      async insert(data: any) {
        const url = `${SUPABASE_URL}/rest/v1/${table}`

        try {
          const response = await Taro.request({
            url,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            data
          })

          if (response.statusCode && response.statusCode >= 400) {
            return { data: null, error: response.data }
          }

          return { data: response.data, error: null }
        } catch (err: any) {
          return { data: null, error: { message: err.message } }
        }
      }
    }

    // 返回支持链式调用的对象
    return {
      select: (columns = '*') => {
        queryBuilder._select = columns
        return {
          eq: (column: string, value: any) => {
            queryBuilder.eq(column, value)
            return {
              single: () => queryBuilder._executeQuery()
            }
          },
          single: () => queryBuilder._executeQuery()
        }
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => {
            queryBuilder.eq(column, value)
            return {
              select: () => ({
                single: async () => {
                  let url = `${SUPABASE_URL}/rest/v1/${table}?${queryBuilder._filters.join('&')}`

                  try {
                    const response = await Taro.request({
                      url,
                      method: 'PATCH',
                      header: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                      },
                      data
                    })

                    if (response.statusCode && response.statusCode >= 400) {
                      return { data: null, error: response.data }
                    }

                    const resultData = Array.isArray(response.data) ? response.data[0] : response.data
                    return { data: resultData, error: null }
                  } catch (err: any) {
                    return { data: null, error: { message: err.message } }
                  }
                }
              })
            }
          }
        }
      },
      insert: (data: any) => {
        return {
          select: () => ({
            single: async () => {
              const url = `${SUPABASE_URL}/rest/v1/${table}`

              try {
                const response = await Taro.request({
                  url,
                  method: 'POST',
                  header: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  data
                })

                if (response.statusCode && response.statusCode >= 400) {
                  return { data: null, error: response.data }
                }

                const resultData = Array.isArray(response.data) ? response.data[0] : response.data
                return { data: resultData, error: null }
              } catch (err: any) {
                return { data: null, error: { message: err.message } }
              }
            }
          })
        }
      }
    }
  }
}

/**
 * 获取 APP 编号
 */
export function getAppNumber() {
  return APP_NUMBER
}

/**
 * 上传文件到 Supabase Storage
 * @param filePath 微信临时文件路径
 * @param bucket 存储桶名称
 * @param folder 文件夹路径
 * @returns 公共访问 URL
 */
export async function uploadFileToStorage(
  filePath: string,
  bucket: string = 'avatars',
  folder: string = 'user-avatars'
): Promise<{ url: string; error: string | null }> {
  if (!SUPABASE_URL) {
    return { url: '', error: 'Supabase URL 未配置' }
  }

  try {
    console.log('📤 开始上传头像，原始路径:', filePath)

    // 1. 只有网络图片（https://）才需要先下载到本地
    // wxfile:// 和 http://tmp/ 是本地临时文件，直接使用
    let localFilePath = filePath

    if (filePath.startsWith('https://')) {
      console.log('📥 检测到网络图片，下载到本地...')

      try {
        const downloadResult = await Taro.downloadFile({
          url: filePath,
          timeout: 15000
        })

        if (downloadResult.statusCode !== 200 || !downloadResult.tempFilePath) {
          return { url: '', error: `文件下载失败: ${downloadResult.errMsg || '未知错误'}` }
        }

        localFilePath = downloadResult.tempFilePath
      } catch (downloadErr: any) {
        console.error('📥 下载异常:', downloadErr)
        return { url: '', error: `文件下载异常: ${downloadErr.errMsg || downloadErr.message}` }
      }
    }

    console.log('📂 本地文件路径:', localFilePath)

    // 2. 生成唯一文件名（统一使用 jpg 扩展名，避免扩展名识别问题）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${randomStr}.jpg`
    const filePathStorage = `${folder}/${fileName}`

    // 3. 使用 Taro.uploadFile 上传到 Supabase Storage
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePathStorage}`

    console.log('📤 上传到 Supabase:', uploadUrl)

    const uploadResult = await Taro.uploadFile({
      url: uploadUrl,
      filePath: localFilePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      timeout: 30000
    })

    console.log('📤 上传结果:', {
      statusCode: uploadResult.statusCode,
      data: uploadResult.data,
      errMsg: uploadResult.errMsg
    })

    if (uploadResult.statusCode && uploadResult.statusCode >= 400) {
      console.error('❌ 上传失败，状态码:', uploadResult.statusCode)
      const errorData = typeof uploadResult.data === 'string'
        ? (() => { try { return JSON.parse(uploadResult.data) } catch { return { message: uploadResult.data } } })()
        : uploadResult.data
      return { url: '', error: errorData?.message || errorData?.error || `上传失败 (${uploadResult.statusCode})` }
    }

    // 4. 返回公共访问 URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePathStorage}`

    console.log('✅ 文件上传成功:', publicUrl)
    return { url: publicUrl, error: null }

  } catch (err: any) {
    console.error('❌ 上传文件异常:', err)
    return { url: '', error: err.errMsg || err.message || '上传失败' }
  }
}

console.log('✅ Supabase HTTP 客户端已初始化')

/**
 * 微信用户类型定义
 */
export interface WechatUser {
  id: string
  openid: string
  unionid?: string
  profile_name?: string
  profile_phone?: string
  profile_avatar?: string
  profile_id_number?: string
  wechat_nickname?: string
  wechat_avatar_url?: string
  mbti?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

/**
 * 用户登录结果类型定义
 */
export interface LoginResult {
  success: boolean
  userInfo?: {
    openid: string
    nickName: string
    avatarUrl: string
    mbti?: string
    id: string
  }
  error?: string
}

/**
 * 更新用户信息结果类型定义
 */
export interface UpdateProfileResult {
  success: boolean
  userInfo?: {
    openid: string
    nickName: string
    avatarUrl: string
    mbti?: string
    id: string
  }
  error?: string
}