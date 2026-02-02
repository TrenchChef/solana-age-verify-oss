import { Connection } from '@solana/web3.js';

export type RpcTag = 'tx' | 'default';

export interface RpcEndpoint {
    url: string;
    tags?: RpcTag[];
    weight?: number; // Priority weight (higher = better)
}

export interface RpcManagerConfig {
    endpoints: RpcEndpoint[];
    healthCheckInterval?: number;
    latencyThreshold?: number;
}

export class RpcManager {
    private connections: Map<string, Connection> = new Map();
    private endpointHealth: Map<string, { healthy: boolean; latency: number }> = new Map();
    private config: RpcManagerConfig;

    constructor(config: RpcManagerConfig) {
        this.config = {
            healthCheckInterval: 30000, // 30s
            latencyThreshold: 1000, // 1s
            ...config
        };

        for (const endpoint of this.config.endpoints) {
            this.connections.set(endpoint.url, new Connection(endpoint.url, 'confirmed'));
            this.endpointHealth.set(endpoint.url, { healthy: true, latency: 0 });
        }

        this.startHealthChecks();
    }

    private startHealthChecks() {
        if (typeof window !== 'undefined') {
            setInterval(() => this.checkAllHealth(), this.config.healthCheckInterval);
        }
    }

    private async checkAllHealth() {
        for (const endpoint of this.config.endpoints) {
            await this.checkHealth(endpoint.url);
        }
    }

    private async checkHealth(url: string) {
        const conn = this.connections.get(url);
        if (!conn) return;

        const start = Date.now();
        try {
            await conn.getLatestBlockhash();
            const latency = Date.now() - start;
            this.endpointHealth.set(url, { healthy: true, latency });
        } catch (e) {
            console.warn(`RPC Health Check Failed for ${url}:`, e);
            this.endpointHealth.set(url, { healthy: false, latency: -1 });
        }
    }

    public getConnection(tag: RpcTag = 'default'): Connection {
        const candidates = this.config.endpoints.filter(e => {
            const health = this.endpointHealth.get(e.url);
            return health?.healthy && (!e.tags || e.tags.includes(tag) || tag === 'default');
        });

        if (candidates.length === 0) {
            // Fallback to any healthy connection
            const anyHealthy = this.config.endpoints.filter(e => this.endpointHealth.get(e.url)?.healthy);
            if (anyHealthy.length > 0) return this.connections.get(anyHealthy[0].url)!;

            // Absolute fallback: return the first connection anyway
            if (this.config.endpoints.length === 0) {
                throw new Error("No RPC endpoints configured. Please provide at least one valid RPC URL.");
            }
            return this.connections.get(this.config.endpoints[0].url)!;
        }

        // Sort by weight (desc) then latency (asc)
        candidates.sort((a, b) => {
            const aHealth = this.endpointHealth.get(a.url)!;
            const bHealth = this.endpointHealth.get(b.url)!;
            const aWeight = a.weight || 0;
            const bWeight = b.weight || 0;

            if (aWeight !== bWeight) return bWeight - aWeight;
            return aHealth.latency - bHealth.latency;
        });

        return this.connections.get(candidates[0].url)!;
    }

    public getEndpoints(): RpcEndpoint[] {
        return this.config.endpoints;
    }
}
