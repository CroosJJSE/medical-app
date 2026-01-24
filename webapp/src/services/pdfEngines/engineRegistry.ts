// src/services/pdfEngines/engineRegistry.ts
// Engine Registry - manages all PDF extraction engines

import type { PDFExtractionEngine } from './types';
import { AsiriEngine } from './asiriEngine';

/**
 * Registry of all available PDF extraction engines
 */
class EngineRegistry {
  private engines: Map<string, PDFExtractionEngine> = new Map();

  constructor() {
    // Register all engines
    this.register(new AsiriEngine());
    // Add more engines here as they are created
  }

  /**
   * Register a new extraction engine
   */
  register(engine: PDFExtractionEngine): void {
    this.engines.set(engine.id, engine);
  }

  /**
   * Get engine by ID
   */
  getEngine(engineId: string): PDFExtractionEngine | undefined {
    return this.engines.get(engineId);
  }

  /**
   * Get all available engines
   */
  getAllEngines(): PDFExtractionEngine[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get engine metadata (without the extract method for UI display)
   */
  getEngineMetadata(engineId: string) {
    const engine = this.engines.get(engineId);
    if (!engine) return undefined;
    
    return {
      id: engine.id,
      name: engine.name,
      version: engine.version,
      description: engine.description
    };
  }

  /**
   * Get all engine metadata
   */
  getAllEngineMetadata() {
    return this.getAllEngines().map(engine => ({
      id: engine.id,
      name: engine.name,
      version: engine.version,
      description: engine.description
    }));
  }
}

// Singleton instance
export const engineRegistry = new EngineRegistry();
