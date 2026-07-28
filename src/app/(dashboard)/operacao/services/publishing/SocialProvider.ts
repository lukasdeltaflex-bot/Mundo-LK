export type SocialNetwork = 'facebook' | 'twitter' | 'linkedin' | 'pinterest' | 'threads';

export class SocialProvider {
  public static share(network: SocialNetwork, urlStr: string, text?: string): void {
    const encodedUrl = encodeURIComponent(urlStr);
    const encodedText = encodeURIComponent(text || '');

    let shareUrl = '';
    switch (network) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
        break;
      case 'threads':
        shareUrl = `https://www.threads.net/intent/post?text=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=600');
    }
  }
}
