import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import type { UploadFile } from "../api/types";

// Course pages: photos are shrunk to 1600 px and JPEG 70 % before sending —
// enough for Claude to read handwriting, and a few hundred kB each.

export const MAX_PAGES = 8;

export interface PickedPage extends UploadFile {
  /** For the thumbnail. */
  uri: string;
  name: string;
}

async function shrink(uri: string, width: number): Promise<PickedPage> {
  const ctx = ImageManipulator.manipulate(uri);
  if (width > 1600) ctx.resize({ width: 1600 });
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return { uri: saved.uri, data: saved.base64 ?? "", mimeType: "image/jpeg", name: "photo.jpg" };
}

export class PermissionDenied extends Error {}

export async function pickPhotos(source: "camera" | "library", remaining: number): Promise<PickedPage[]> {
  const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new PermissionDenied(source === "camera" ? "Autorise l'appareil photo dans les réglages du téléphone." : "Autorise l'accès aux photos dans les réglages du téléphone.");
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 1,
    allowsMultipleSelection: source === "library",
    selectionLimit: Math.max(1, remaining),
  };
  const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return [];
  const pages: PickedPage[] = [];
  for (const asset of result.assets.slice(0, remaining)) pages.push(await shrink(asset.uri, asset.width));
  return pages;
}

export async function pickPdf(): Promise<PickedPage | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if ((asset.size ?? 0) > 15 * 1024 * 1024) throw new Error("Ce PDF est trop lourd (15 Mo au plus).");
  const data = await new File(asset.uri).base64();
  return { uri: asset.uri, data, mimeType: "application/pdf", name: asset.name };
}
