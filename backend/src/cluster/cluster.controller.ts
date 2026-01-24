import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ClusterService } from './cluster.service';
import { ClusterDetailResponse, ClusterResponse } from './cluster.types';

@Controller('api/cluster')
export class ClusterController {
  constructor(private readonly clusterService: ClusterService) {}

  @Post()
  async cluster(@Body('query') query: string): Promise<ClusterResponse> {
    return this.clusterService.createJob(query);
  }

  @Get(':jobId/:slug')
  async getCluster(
    @Param('jobId') jobId: string,
    @Param('slug') slug: string
  ): Promise<ClusterDetailResponse> {
    const result = this.clusterService.getClusterDetail(jobId, slug);
    if (!result) {
      throw new NotFoundException('Cluster not found');
    }

    return result;
  }
}
