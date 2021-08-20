export interface ContractWrapper<T = any> {
  wrap(asset?: string): T;
}
