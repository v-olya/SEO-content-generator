import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClusterModule } from './cluster/cluster.module';
import { ArticleModule } from './article/article.module';

@Module({
  imports: [ConfigModule.forRoot(), ClusterModule, ArticleModule],
})
export class AppModule {}
