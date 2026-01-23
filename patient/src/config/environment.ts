/**
 * Environment Configuration for DCMS Patient Frontend
 * Manages environment variables for dev, staging, and production
 */

interface EnvironmentConfig {
  mode: 'dev' | 'staging' | 'production';
  apiUrl: string;
  frontendUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableDevTools: boolean;
  apiTimeout: number;
  isProduction: boolean;
  isStaging: boolean;
  isDev: boolean;
}

class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
    this.logEnvironment();
  }

  private loadConfig(): EnvironmentConfig {
    const mode = (import.meta.env.VITE_MODE || 'dev') as 'dev' | 'staging' | 'production';
    
    return {
      mode,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
      frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
      logLevel: (import.meta.env.VITE_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
      apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
      isProduction: mode === 'production',
      isStaging: mode === 'staging',
      isDev: mode === 'dev',
    };
  }

  private validateConfig(): void {
    if (!this.config.supabaseUrl) {
      console.warn('⚠️  VITE_SUPABASE_URL is not set');
    }
    if (!this.config.supabaseAnonKey) {
      console.warn('⚠️  VITE_SUPABASE_ANON_KEY is not set');
    }
  }

  private logEnvironment(): void {
    if (this.config.isDev) {
      console.log('🔧 Environment:', this.config.mode);
      console.log('🔗 API URL:', this.config.apiUrl);
      console.log('🌐 Frontend URL:', this.config.frontendUrl);
    }
  }

  public getApiUrl(): string {
    return this.config.apiUrl;
  }

  public getApiTimeout(): number {
    return this.config.apiTimeout;
  }

  public getSupabaseUrl(): string {
    return this.config.supabaseUrl;
  }

  public getSupabaseAnonKey(): string {
    return this.config.supabaseAnonKey;
  }

  public getFrontendUrl(): string {
    return this.config.frontendUrl;
  }

  public getMode(): string {
    return this.config.mode;
  }

  public isProduction(): boolean {
    return this.config.isProduction;
  }

  public isStaging(): boolean {
    return this.config.isStaging;
  }

  public isDev(): boolean {
    return this.config.isDev;
  }

  public getLogLevel(): string {
    return this.config.logLevel;
  }

  public isDevToolsEnabled(): boolean {
    return this.config.enableDevTools;
  }
}

export const environment = new EnvironmentManager();
