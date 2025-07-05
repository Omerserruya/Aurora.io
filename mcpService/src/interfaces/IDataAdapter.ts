export interface ContextData {
  text: string;
  metadata: {
    source: string;
    timestamp: string;
    reliability: number;
  };
  error?: string;
}

export interface IDataAdapter {
  name: string;
  getContextData(userId: string, query: string, connectionId: string): Promise<ContextData>;
  supportsQuery(query: string): boolean;
} 