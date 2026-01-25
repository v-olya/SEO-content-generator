import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { ClusterModule } from '../cluster/cluster.module';

@Module({
  imports: [ConfigModule, ClusterModule],
  controllers: [ArticleController, ImageController],
  providers: [ArticleService, ImageService],
})
export class ArticleModule {}
