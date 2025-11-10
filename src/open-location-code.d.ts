declare module 'open-location-code' {
  export interface CodeArea {
    latitudeLo: number;
    longitudeLo: number;
    latitudeHi: number;
    longitudeHi: number;
    latitudeCenter: number;
    longitudeCenter: number;
    codeLength: number;
  }

  export class OpenLocationCode {
    static isValid(code: string): boolean;
    static isShort(code: string): boolean;
    static isFull(code: string): boolean;
    static encode(latitude: number, longitude: number, codeLength?: number): string;
    static decode(code: string): CodeArea;
    static recoverNearest(shortCode: string, referenceLatitude: number, referenceLongitude: number): string;
    static shorten(code: string, latitude: number, longitude: number): string;
  }
}
