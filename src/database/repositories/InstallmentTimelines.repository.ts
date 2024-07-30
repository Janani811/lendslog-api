import { Inject } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { installmentTimelines, lends } from '../schemas/schema';

export class InstallmentTimelineRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  // get all installment timelines based on it_lend_id
  async getAll(args: { it_lend_id: number }) {
    return await this.dbObject.db.query.installmentTimelines.findMany({
      where: eq(installmentTimelines.it_lend_id, args.it_lend_id),
      //   with: { lend: true },
    });
  }

  // create installment timelines
  async addInstallmentTimelines(data: any) {
    return await this.dbObject.db.insert(installmentTimelines).values(data).returning();
  }
  // get all installment timelines based on it_lend_id
  async getAllPending(user_id: number) {
    return this.dbObject.db
      .select({
        it_id: installmentTimelines.it_id,
        it_installment_date:
          sql`TO_CHAR(${installmentTimelines.it_installment_date},'dd-mm-yyyy')`.as(
            'it_installment_date',
          ),
        it_installement_status: installmentTimelines.it_installement_status,
        ld_id: lends.ld_id,
        ld_borrower_name: lends.ld_borrower_name,
        ld_borrower_phoneno: lends.ld_borrower_phoneno,
        it_term_amount: sql`ROUND(it_term_amount, 3)`,
      })
      .from(installmentTimelines)
      .innerJoin(lends, eq(installmentTimelines.it_lend_id, lends.ld_id))
      .where(
        sql`DATE(it_installment_date) <= CURRENT_DATE and it_installement_status = 1 and ld_lender_id = ${user_id}`,
      );
  }
}
