import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ArticleService } from './article.service';
import {
  ArticleStatusResponse,
  StartArticleRequest,
  StartArticleResponse,
} from '../../../shared/cluster.types';

@Controller('api/article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post('generate')
  async startGeneration(@Body() body: StartArticleRequest): Promise<StartArticleResponse> {
    return this.articleService.startGeneration(body.jobId, body.slug);
  }

  @Get('status/:articleId')
  async getStatus(@Param('articleId') articleId: string): Promise<ArticleStatusResponse> {
    const result = this.articleService.getStatus(articleId);
    if (!result) {
      throw new NotFoundException('Article job not found');
    }
    return result;
  }
}
