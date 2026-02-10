/**
 * Utilitaires pour la décomposition et reconstitution des pixels d'image
 * Les images sont converties en chaîne de pixels (base64) pour stockage dans Firebase Realtime Database
 * et reconstituées en image à partir de cette chaîne.
 */

export interface ImagePixelData {
  /** Données pixels encodées en base64 */
  pixelData: string;
  /** Largeur de l'image */
  width: number;
  /** Hauteur de l'image */
  height: number;
  /** Type MIME de l'image */
  mimeType: string;
  /** Taille originale en octets */
  originalSize: number;
  /** Date d'encodage */
  encodedAt: string;
}

// Dimensions maximales pour la compression avant stockage Firebase
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 0.6;

/**
 * Décompose une image (Blob/File) en une chaîne de pixels base64 pour stockage Firebase.
 * L'image est redimensionnée et compressée avant l'encodage.
 *
 * @param blob - Le Blob ou File de l'image source
 * @param fileName - Nom optionnel du fichier
 * @returns Un objet ImagePixelData contenant les pixels encodés et les métadonnées
 */
export async function encodeImageToPixelString(blob: Blob, fileName?: string): Promise<ImagePixelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculer les nouvelles dimensions en gardant le ratio
          let { width, height } = img;
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Créer un canvas pour extraire les pixels
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }

          // Dessiner l'image redimensionnée sur le canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Extraire les données en base64 (JPEG compressé)
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

          // Retirer le préfixe "data:image/jpeg;base64," pour stocker uniquement les pixels
          const base64Data = dataUrl.split(',')[1];

          const pixelData: ImagePixelData = {
            pixelData: base64Data,
            width,
            height,
            mimeType: 'image/jpeg',
            originalSize: blob.size,
            encodedAt: new Date().toISOString(),
          };

          resolve(pixelData);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Reconstitue une image à partir de la chaîne de pixels base64 stockée dans Firebase.
 * Retourne une URL de données (data URL) prête à être utilisée dans un tag <img>.
 *
 * @param pixelData - L'objet ImagePixelData provenant de Firebase
 * @returns Une data URL utilisable comme src d'une balise <img>
 */
export function decodePixelStringToImageUrl(pixelData: ImagePixelData): string {
  if (!pixelData?.pixelData) {
    throw new Error('Données pixels invalides');
  }

  const mimeType = pixelData.mimeType || 'image/jpeg';
  return `data:${mimeType};base64,${pixelData.pixelData}`;
}

/**
 * Reconstitue une image à partir de la chaîne de pixels et retourne un Blob.
 *
 * @param pixelData - L'objet ImagePixelData provenant de Firebase
 * @returns Un Blob de l'image reconstituée
 */
export function decodePixelStringToBlob(pixelData: ImagePixelData): Blob {
  if (!pixelData?.pixelData) {
    throw new Error('Données pixels invalides');
  }

  const byteCharacters = atob(pixelData.pixelData);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.codePointAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: pixelData.mimeType || 'image/jpeg' });
}

/**
 * Reconstitue les pixels bruts (RGBA) à partir de la chaîne encodée.
 * Utile si on veut manipuler les pixels individuellement.
 *
 * @param pixelData - L'objet ImagePixelData provenant de Firebase
 * @returns Un objet contenant le tableau de pixels RGBA, la largeur et la hauteur
 */
export async function decodePixelStringToRawPixels(
  pixelData: ImagePixelData
): Promise<{ pixels: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const dataUrl = decodePixelStringToImageUrl(pixelData);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelData.width;
      canvas.height = pixelData.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, pixelData.width, pixelData.height);
      const imageData = ctx.getImageData(0, 0, pixelData.width, pixelData.height);

      resolve({
        pixels: imageData.data,
        width: pixelData.width,
        height: pixelData.height,
      });
    };

    img.onerror = () => reject(new Error('Erreur lors de la reconstitution des pixels'));
    img.src = dataUrl;
  });
}

/**
 * Encode plusieurs images en parallèle.
 *
 * @param blobs - Tableau de Blobs d'images
 * @returns Tableau d'objets ImagePixelData
 */
export async function encodeMultipleImages(blobs: Blob[]): Promise<ImagePixelData[]> {
  return Promise.all(blobs.map((blob) => encodeImageToPixelString(blob)));
}

/**
 * Décode plusieurs images depuis Firebase et retourne les data URLs.
 *
 * @param pixelDataArray - Tableau d'objets ImagePixelData
 * @returns Tableau de data URLs
 */
export function decodeMultipleImages(pixelDataArray: ImagePixelData[]): string[] {
  if (!pixelDataArray || !Array.isArray(pixelDataArray)) {
    return [];
  }
  return pixelDataArray.map((pd) => decodePixelStringToImageUrl(pd));
}

/**
 * Estime la taille en octets des données encodées (pour vérifier les limites Firebase).
 * Firebase Realtime Database a une limite de ~10 MB par noeud.
 *
 * @param pixelData - L'objet ImagePixelData
 * @returns Taille estimée en octets
 */
export function estimateStorageSize(pixelData: ImagePixelData): number {
  // Base64 augmente la taille d'environ 33%
  return Math.ceil(pixelData.pixelData.length * 0.75);
}
