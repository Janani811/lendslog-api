import { Test } from '@nestjs/testing';
import { AppModule } from '../../../../app.module';
import { DatabaseModule } from '../../../database.module';
import { DatabaseService } from '../../../database.service';
import { UserRepository } from '../../User.repository';

describe('UserRepository', () => {
  let db: DatabaseService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();
    db = module.get<DatabaseService>(DatabaseService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  beforeEach(async () => {
    await db.cleanTables();
  });
  afterAll(async () => {
    await db.close();
  });

  describe('getUsers', () => {
    it('should get users', async () => {
      expect(await userRepository.getUsers()).toEqual([]);
    });
  });
});
