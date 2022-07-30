import { Test, TestingModule } from '@nestjs/testing';
import { ExplorerService } from './explorer.service';

describe('ExplorerService', () => {
  let service: ExplorerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExplorerService],
    }).compile();

    service = module.get<ExplorerService>(ExplorerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
