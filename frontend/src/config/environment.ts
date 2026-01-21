/**
 * Environment Configuration for Frontend
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

    if (this.config.isProduction) {
      if (!this.config.apiUrl.startsWith('https://')) {
        console.error('❌ Production API URL must use HTTPS');
      }
      if (!this.config.frontendUrl.startsWith('https://')) {
        console.error('❌ Production Frontend URL must use HTTPS');
      }
    }
  }

  private logEnvironment(): void {
    console.log(`\n========================================`);
    console.log(`🔧 Environment: ${this.config.mode.toUpperCase()}`);
    console.log(`🔗 API URL: ${this.config.apiUrl}`);
    console.log(`📱 Frontend URL: ${this.config.frontendUrl}`);
    console.log(`📊 Log Level: ${this.config.logLevel}`);
    console.log(`⏱️  API Timeout: ${this.config.apiTimeout}ms`);
    console.log(`🛠️  Dev Tools: ${this.config.enableDevTools ? 'Enabled' : 'Disabled'}`);
    console.log(`🗄️  Database: Connected via API at ${this.config.apiUrl}`);
    console.log(`========================================\n`);
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  getFrontendUrl(): string {
    return this.config.frontendUrl;
  }

  getLogLevel(): string {
    return this.config.logLevel;
  }

  getSupabaseConfig() {
    return {
      url: this.config.supabaseUrl,
      anonKey: this.config.supabaseAnonKey,
    };
  }

  getApiTimeout(): number {
    return this.config.apiTimeout;
  }

  isProduction(): boolean {
    return this.config.isProduction;
  }

  isStaging(): boolean {
    return this.config.isStaging;
  }

  isDev(): boolean {
    return this.config.isDev;
  }

  isDevelopment(): boolean {
    return this.config.isDev || this.config.isStaging;
  }

  shouldEnableDevTools(): boolean {
    return this.config.enableDevTools;
  }
}

// Create singleton instance
export const environment = new EnvironmentManager();

export type { EnvironmentConfig };
