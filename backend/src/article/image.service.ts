import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ERROR_MESSAGE, IMAGE_PROMPT_TEMPLATE } from '../constants';
import { StartImageRequest, StartImageResponse } from '../../../shared/cluster.types';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateImage(body: StartImageRequest): Promise<StartImageResponse> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error(ERROR_MESSAGE.OpenAiKeyNotConfigured);
    }

    const { label, items } = body;
    const itemsPreview = items.slice(0, 6).join(', ');
    const prompt = IMAGE_PROMPT_TEMPLATE.replace('{label}', label).replace('{items}', itemsPreview);

    this.logger.log(`Generating image for label="${label}"`);

    try {
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1792x1024',
          response_format: 'b64_json',
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        this.logger.error(`Image API error ${resp.status}: ${txt}`);
        throw new Error(ERROR_MESSAGE.ImageGenerationFailed);
      }

      const json = await resp.json();
      const b64 = json.data?.[0]?.b64_json as string | undefined;
      if (!b64) {
        throw new Error(ERROR_MESSAGE.NoImageDataReturned);
      }

      const imageId = randomUUID();
      const dataUrl = `data:image/png;base64,${b64}`;

      return {
        imageId,
        dataUrl,
        prompt,
      };
    } catch (err) {
      this.logger.error(
        `Image generation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }
}
