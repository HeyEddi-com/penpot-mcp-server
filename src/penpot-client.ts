/**
 * Penpot API Client
 * Wrapper around the auto-generated OpenAPI client
 */

import { HttpsProxyAgent } from 'https-proxy-agent';
import { v4 as uuidv4 } from 'uuid';
import { createClient, createConfig } from './generated/client/index.js';
import {
  postCommandGetProfile,
  postCommandGetTeams,
  postCommandGetProjects,
  postCommandGetProjectFiles,
  postCommandGetFile,
  postCommandCreateFile,
  postCommandRenameFile,
  postCommandDeleteFile,
  postCommandUpdateFile,
} from './generated/index.js';
import type {
  PenpotConfig,
  PenpotProject,
  PenpotFile,
  PenpotTeam,
  CreateFileRequest,
  UpdateFileRequest,
  BaseChange,
} from './types.js';

// Re-export all generated SDK functions for direct use in tools
export * from './generated/index.js';

/**
 * Convert camelCase string to kebab-case
 */
function toKebabCase(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Recursively convert object keys from camelCase to kebab-case
 */
function convertKeysToKebabCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToKebabCase);
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const kebabKey = toKebabCase(key);
      result[kebabKey] = convertKeysToKebabCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

export class PenpotClient {
  private config: PenpotConfig;
  private proxyAgent: HttpsProxyAgent<string> | undefined;
  public client: ReturnType<typeof createClient>; // Made public for direct access in tools

  constructor(config: PenpotConfig) {
    this.config = config;

    // Setup proxy support if HTTP_PROXY or HTTPS_PROXY environment variables are set
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;

    // Check if TLS verification should be disabled
    const rejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0';

    if (proxyUrl) {
      this.proxyAgent = new HttpsProxyAgent(proxyUrl, {
        rejectUnauthorized,
      });
      console.error(`Using proxy: ${proxyUrl.replace(/:[^:@]+@/, ':***@')}`);
      if (!rejectUnauthorized) {
        console.error('⚠️  TLS certificate verification is disabled');
      }
    }

    // Create custom fetch function with proxy support
    const customFetch: typeof fetch | undefined = this.proxyAgent
      ? // eslint-disable-next-line no-undef
        ((async (input: string | Request | URL, init?: RequestInit) => {
          // Log proxy usage for debugging
          if (process.env.DEBUG_PROXY) {
            const debugUrl =
              typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.toString()
                  : (input as Request).url;
            console.error(`[PROXY] Request via proxy: ${debugUrl}`);
          }

          // Convert Headers object to plain object for node-fetch
          const headers: Record<string, string> = {};

          // Extract headers and body from Request object if input is a Request
          const sourceHeaders = input instanceof Request ? input.headers : init?.headers;
          let body = init?.body;
          let method = init?.method;

          if (input instanceof Request) {
            // Extract all necessary properties from Request
            method = input.method;
            // For Request objects with body, we need to extract it
            if (input.body) {
              body = await input.text();
            }
          }

          if (sourceHeaders) {
            if (sourceHeaders instanceof Headers) {
              sourceHeaders.forEach((value, key) => {
                headers[key] = value;
              });
            } else if (Array.isArray(sourceHeaders)) {
              sourceHeaders.forEach(([key, value]) => {
                headers[key] = value;
              });
            } else {
              Object.assign(headers, sourceHeaders);
            }
          }

          const nodeInit = {
            ...init,
            method,
            headers,
            body,
            agent: this.proxyAgent,
          };

          // Use node-fetch for proxy support
          const nodeFetch = await import('node-fetch');
          const url =
            typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          return nodeFetch.default(url, nodeInit as any) as any;
        }) as typeof fetch)
      : undefined;

    // Custom body serializer that converts camelCase to kebab-case
    const kebabCaseBodySerializer = (body: any): string => {
      const convertedBody = convertKeysToKebabCase(body);
      return JSON.stringify(convertedBody, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
    };

    // Create the generated client with our configuration
    this.client = createClient(
      createConfig({
        baseUrl: `${this.config.apiUrl}/api/rpc`,
        headers: {
          Authorization: `Token ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        fetch: customFetch,
        bodySerializer: kebabCaseBodySerializer,
      })
    );
  }

  // ============================================================================
  // Profile
  // ============================================================================

  async getProfile(): Promise<unknown> {
    const result = await postCommandGetProfile({
      client: this.client,
      body: {},
    });

    if (result.error) {
      throw new Error(`Failed to get profile: ${JSON.stringify(result.error)}`);
    }

    return result.data;
  }

  // ============================================================================
  // Teams & Projects
  // ============================================================================

  async listTeams(): Promise<PenpotTeam[]> {
    const result = await postCommandGetTeams({
      client: this.client,
      body: {},
    });

    if (result.error) {
      throw new Error(`Failed to list teams: ${JSON.stringify(result.error)}`);
    }

    return result.data as PenpotTeam[];
  }

  async listProjects(teamId: string): Promise<PenpotProject[]> {
    const result = await postCommandGetProjects({
      client: this.client,
      body: { teamId },
    });

    if (result.error) {
      throw new Error(`Failed to list projects: ${JSON.stringify(result.error)}`);
    }

    return result.data as any;
  }

  // ============================================================================
  // Files
  // ============================================================================

  async listFiles(projectId: string): Promise<PenpotFile[]> {
    const result = await postCommandGetProjectFiles({
      client: this.client,
      body: { projectId },
    });

    if (result.error) {
      throw new Error(`Failed to list files: ${JSON.stringify(result.error)}`);
    }

    return result.data as any;
  }

  async getFile(fileId: string): Promise<PenpotFile> {
    const result = await postCommandGetFile({
      client: this.client,
      body: { id: fileId },
    });

    if (result.error) {
      throw new Error(`Failed to get file: ${JSON.stringify(result.error)}`);
    }

    return result.data as any;
  }

  async createFile(request: CreateFileRequest): Promise<PenpotFile> {
    const result = await postCommandCreateFile({
      client: this.client,
      body: {
        projectId: request.projectId,
        name: request.name,
        isShared: request.isShared ?? false,
      },
    });

    if (result.error) {
      throw new Error(`Failed to create file: ${JSON.stringify(result.error)}`);
    }

    return result.data as any;
  }

  async renameFile(fileId: string, name: string): Promise<void> {
    const result = await postCommandRenameFile({
      client: this.client,
      body: {
        id: fileId,
        name,
      },
    });

    if (result.error) {
      throw new Error(`Failed to rename file: ${JSON.stringify(result.error)}`);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    const result = await postCommandDeleteFile({
      client: this.client,
      body: {
        id: fileId,
      },
    });

    if (result.error) {
      throw new Error(`Failed to delete file: ${JSON.stringify(result.error)}`);
    }
  }

  // ============================================================================
  // File Updates (the core of manipulation)
  // ============================================================================

  async updateFile(request: UpdateFileRequest): Promise<unknown> {
    const result = await postCommandUpdateFile({
      client: this.client,
      body: {
        id: request.id,
        sessionId: request.sessionId,
        revn: request.revn,
        vern: 0, // Version number, 0 for new changes
        changes: request.changes as any, // Generated client handles type conversion
      },
    });

    if (result.error) {
      throw new Error(`Failed to update file: ${JSON.stringify(result.error)}`);
    }

    return result.data;
  }

  /**
   * Convenience method to update a file with changes
   */
  async applyChanges(fileId: string, changes: BaseChange[]): Promise<unknown> {
    // Generate a session ID for this update
    const sessionId = uuidv4();

    // Get current file to get revision number
    const file = await this.getFile(fileId);

    return this.updateFile({
      id: fileId,
      sessionId,
      revn: file.revn as any, // Type mismatch between generated and custom types
      changes,
    });
  }

  // ============================================================================
  // Comments
  // ============================================================================

  async createCommentThread(params: {
    fileId: string;
    pageId: string;
    frameId: string;
    position: { x: number; y: number };
    content: string;
    shareId?: string;
    mentions?: string[];
  }): Promise<any> {
    const response = await this.client.post({
      url: '/command/create-comment-thread',
      body: {
        fileId: params.fileId,
        pageId: params.pageId,
        frameId: params.frameId,
        position: params.position,
        content: params.content,
        shareId: params.shareId || null,
        mentions: params.mentions || [],
      } as any,
    });

    if (response.error) {
      throw new Error(`Failed to create comment thread: ${JSON.stringify(response.error)}`);
    }

    return response.data;
  }

  async getCommentThreads(params: {
    fileId?: string;
    teamId?: string;
    shareId?: string;
  }): Promise<any[]> {
    const response = await this.client.post({
      url: '/command/get-comment-threads',
      body: {
        ...(params.fileId && { fileId: params.fileId }),
        ...(params.teamId && { teamId: params.teamId }),
        ...(params.shareId && { shareId: params.shareId }),
      } as any,
    });

    if (response.error) {
      throw new Error(`Failed to get comment threads: ${JSON.stringify(response.error)}`);
    }

    return response.data as any[];
  }

  async getCommentThread(fileId: string, threadId: string): Promise<any> {
    const response = await this.client.post({
      url: '/command/get-comment-thread',
      body: { fileId, id: threadId } as any,
    });

    if (response.error) {
      throw new Error(`Failed to get comment thread: ${JSON.stringify(response.error)}`);
    }

    return response.data;
  }

  async getComments(threadId: string): Promise<any[]> {
    const response = await this.client.post({
      url: '/command/get-comments',
      body: { threadId } as any,
    });

    if (response.error) {
      throw new Error(`Failed to get comments: ${JSON.stringify(response.error)}`);
    }

    return response.data as any[];
  }

  async createComment(
    threadId: string,
    content: string,
    shareId?: string,
    mentions?: string[]
  ): Promise<any> {
    const response = await this.client.post({
      url: '/command/create-comment',
      body: {
        threadId,
        content,
        ...(shareId && { shareId }),
        ...(mentions && { mentions }),
      } as any,
    });

    if (response.error) {
      throw new Error(`Failed to create comment: ${JSON.stringify(response.error)}`);
    }

    return response.data;
  }

  async updateComment(
    id: string,
    content: string,
    shareId?: string,
    mentions?: string[]
  ): Promise<any> {
    const response = await this.client.post({
      url: '/command/update-comment',
      body: {
        id,
        content,
        ...(shareId && { shareId }),
        ...(mentions && { mentions }),
      } as any,
    });

    if (response.error) {
      throw new Error(`Failed to update comment: ${JSON.stringify(response.error)}`);
    }

    return response.data;
  }

  async deleteComment(id: string, shareId?: string): Promise<void> {
    const response = await this.client.post({
      url: '/command/delete-comment',
      body: {
        id,
        ...(shareId && { shareId }),
      } as any,
    });

    if (response.error) {
      throw new Error(`Failed to delete comment: ${JSON.stringify(response.error)}`);
    }
  }

  async updateCommentThreadStatus(id: string, isResolved: boolean): Promise<any> {
    const response = await this.client.post({
      url: '/command/update-comment-thread-status',
      body: { id, isResolved } as any,
    });

    if (response.error) {
      throw new Error(`Failed to update comment thread status: ${JSON.stringify(response.error)}`);
    }

    return response.data;
  }

  async updateCommentThreadPosition(
    id: string,
    frameId: string,
    position: { x: number; y: number },
    shareId?: string
  ): Promise<any> {
    const response = await this.client.post({
      url: '/command/update-comment-thread-position',
      body: {
        id,
        frameId,
        position,
        ...(shareId && { shareId }),
      } as any,
    });

    if (response.error) {
      throw new Error(
        `Failed to update comment thread position: ${JSON.stringify(response.error)}`
      );
    }

    return response.data;
  }

  async deleteCommentThread(id: string): Promise<void> {
    const response = await this.client.post({
      url: '/command/delete-comment-thread',
      body: { id } as any,
    });

    if (response.error) {
      throw new Error(`Failed to delete comment thread: ${JSON.stringify(response.error)}`);
    }
  }

  async getUnreadCommentThreads(teamId: string): Promise<any[]> {
    const response = await this.client.post({
      url: '/command/get-unread-comment-threads',
      body: { teamId } as any,
    });

    if (response.error) {
      throw new Error(`Failed to get unread comment threads: ${JSON.stringify(response.error)}`);
    }

    return response.data as any[];
  }

  // ============================================================================
  // Share Links
  // ============================================================================

  async createShareLink(params: {
    fileId: string;
    whoComment: string;
    whoInspect: string;
    pages: string[];
  }): Promise<any> {
    const response = await this.client.post({
      url: '/command/create-share-link',
      body: {
        fileId: params.fileId,
        whoComment: params.whoComment,
        whoInspect: params.whoInspect,
        pages: params.pages,
      } as any,
    });

    if (response.error) {
      throw new Error(`Failed to create share link: ${JSON.stringify(response.error)}`);
    }

    return response.data;
  }

  async deleteShareLink(id: string): Promise<void> {
    const response = await this.client.post({
      url: '/command/delete-share-link',
      body: { id } as any,
    });

    if (response.error) {
      throw new Error(`Failed to delete share link: ${JSON.stringify(response.error)}`);
    }
  }

  // ============================================================================
  // Media
  // ============================================================================

  async createFileMediaObjectFromUrl(params: {
    fileId: string;
    isLocal: boolean;
    url: string;
    id?: string;
    name?: string;
  }): Promise<any> {
    const response = await this.client.post({
      url: '/command/create-file-media-object-from-url',
      body: {
        fileId: params.fileId,
        isLocal: params.isLocal,
        url: params.url,
        ...(params.id && { id: params.id }),
        ...(params.name && { name: params.name }),
      } as any,
    });

    if (response.error) {
      throw new Error(`Failed to create media from URL: ${JSON.stringify(response.error)}`);
    }

    return response.data;
  }

  async cloneFileMediaObject(params: {
    fileId: string;
    id: string;
    isLocal: boolean;
  }): Promise<any> {
    const response = await this.client.post({
      url: '/command/clone-file-media-object',
      body: {
        fileId: params.fileId,
        id: params.id,
        isLocal: params.isLocal,
      } as any,
    });

    if (response.error) {
      throw new Error(`Failed to clone media object: ${JSON.stringify(response.error)}`);
    }

    return response.data;
  }
}
