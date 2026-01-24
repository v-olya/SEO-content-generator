import { Module } from '@nestjs/common';
import { ClusterController } from './cluster/cluster.controller';
import { ClusterService } from './cluster/cluster.service';

@Module({
  controllers: [ClusterController],
  providers: [ClusterService]
})
export class AppModule {}
