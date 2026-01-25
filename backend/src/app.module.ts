import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClusterController } from './cluster/cluster.controller';
import { ClusterService } from './cluster/cluster.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ClusterController],
  providers: [ClusterService],
})
export class AppModule {}
