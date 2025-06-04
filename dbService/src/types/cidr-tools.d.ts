declare module 'cidr-tools' {
  export class CIDR {
    static overlap(cidr1: string, cidr2: string): boolean;
  }
} 