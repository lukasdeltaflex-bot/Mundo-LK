export class CopyProvider {
  public static async copyText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public static async copyLink(url: string): Promise<boolean> {
    return this.copyText(url);
  }
}
