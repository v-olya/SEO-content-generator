import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { ClusterModule } from '../cluster/cluster.module';

@Module({
  imports: [ConfigModule, ClusterModule],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
