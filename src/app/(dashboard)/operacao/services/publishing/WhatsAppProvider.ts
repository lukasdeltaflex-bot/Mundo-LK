export class WhatsAppProvider {
  public static share(text: string, phone?: string): void {
    const encodedText = encodeURIComponent(text);
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank');
  }
}
