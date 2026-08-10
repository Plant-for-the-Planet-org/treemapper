import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ScientificSpeciesService } from '../services/scientific-species.service';
import { BulkUploadScientificSpeciesDto, ScientificSpeciesFilterDto } from '../dto/scientific-species.dto';
import { SearchSpeciesQueryDto } from '../dto/search-species-query.dto';
import { ExtendedUser } from 'src/users/entities/user.entity';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { SuperAdminGuard } from 'src/auth/super-admin.guard';

@Controller('scientific-species')
export class ScientificSpeciesController {
  constructor(private readonly scientificSpeciesService: ScientificSpeciesService) { }

  @Post('bulk-upload')
  @UseGuards(SuperAdminGuard)
  async bulkUpload(@Body() bulkUploadDto: BulkUploadScientificSpeciesDto, @CurrentUser() userData: ExtendedUser,) {
    return this.scientificSpeciesService.bulkUpload(bulkUploadDto);
  }

  @Get()
  async getAll(@Query() filterDto: ScientificSpeciesFilterDto) {
    return this.scientificSpeciesService.getAll(filterDto);
  }


  @Get('search')
  searchSpecies(
    @Query() queryDto: SearchSpeciesQueryDto) {
    return this.scientificSpeciesService.searchSpecies(queryDto.name, queryDto.limit);
  }
}
