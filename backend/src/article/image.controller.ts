import { Body, Controller, Post } from '@nestjs/common';
import { ImageService } from './image.service';
import { StartImageRequest, StartImageResponse } from '../../../shared/cluster.types';

@Controller('api/image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('generate')
  async generate(@Body() body: StartImageRequest): Promise<StartImageResponse> {
    return this.imageService.generateImage(body);
  }
}
