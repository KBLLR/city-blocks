declare module "pluscodes" {
  export interface CodeArea {
    latitudeLo: number;
    longitudeLo: number;
    latitudeHi: number;
    longitudeHi: number;
    latitudeCenter: number;
    longitudeCenter: number;
    codeLength: number;
  }

  export function isValid(code: string): boolean;
  export function isShort(code: string): boolean;
  export function isFull(code: string): boolean;
  export function encode(
    latitude: number,
    longitude: number,
    codeLength?: number
  ): string;
  export function decode(code: string): CodeArea;
  export function recoverNearest(
    shortCode: string,
    referenceLatitude: number,
    referenceLongitude: number
  ): string;
  export function shorten(
    code: string,
    latitude: number,
    longitude: number
  ): string;
}
