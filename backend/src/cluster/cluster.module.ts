import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClusterController } from './cluster.controller';
import { ClusterService } from './cluster.service';

@Module({
  imports: [ConfigModule],
  controllers: [ClusterController],
  providers: [ClusterService],
  exports: [ClusterService],
})
export class ClusterModule {}
