import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { lends } from '../schemas/schema';

export class LendsRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  // get all lends based on ld_lender_id
  async getAll(args: { ld_lender_id: number }) {
    return this.dbObject.db.query.lends.findMany({
      where: eq(lends.ld_lender_id, args.ld_lender_id),
      with: { installmentTimelines: true },
    });
  }

  // get specific lend based on ld_id
  async getOne(args: { ld_id: number }) {
    return this.dbObject.db.query.lends.findFirst({
      where: eq(lends.ld_id, args.ld_id),
      with: { installmentTimelines: true },
    });
  }

  // create lend
  async addLend(data: any) {
    return await this.dbObject.db.insert(lends).values(data).returning();
  }
}
