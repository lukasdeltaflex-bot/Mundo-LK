export class TelegramProvider {
  public static share(text: string, urlStr?: string): void {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = urlStr ? encodeURIComponent(urlStr) : '';
    const shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    window.open(shareUrl, '_blank');
  }
}
