import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { installmentTimelines } from '../schemas/schema';

export class InstallmentTimelineRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  // get all installment timelines based on it_lend_id
  async getAll(args: { it_lend_id: number }) {
    return this.dbObject.db.query.installmentTimelines.findMany({
      where: eq(installmentTimelines.it_lend_id, args.it_lend_id),
      //   with: { lend: true },
    });
  }

  // create installment timelines
  async addInstallmentTimelines(data: any) {
    return await this.dbObject.db.insert(installmentTimelines).values(data).returning();
  }
}
