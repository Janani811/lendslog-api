import { Inject } from '@nestjs/common';
import { and, asc, desc, eq, like, ilike, or, sql, SQL } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { installmentTimelines, lends } from '../schemas/schema';

export class LendsRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  // get all lends based on ld_lender_id
  async getAll(args: { ld_lender_id: number; search?: string }) {
    const query: SQL[] = [eq(lends.ld_lender_id, args.ld_lender_id), eq(lends.ld_is_deleted, 0)];
    if (args.search.length)
      query.push(
        or(
          ilike(lends.ld_borrower_name, `%${args.search}%`),
          like(lends.ld_borrower_phoneno, `%${args.search}%`),
        ),
      );
    return this.dbObject.db.query.lends.findMany({
      orderBy: desc(lends.ld_id),
      where: and(...query),
      with: {
        installmentTimelines: {
          orderBy: asc(installmentTimelines.it_id),
          extras: {
            it_installment_date:
              sql`TO_CHAR(${installmentTimelines.it_installment_date},'dd/mm/yyyy')`.as(
                'it_installment_date',
              ),
          },
        },
      },
    });
  }

  // get specific lend based on ld_id
  async getOne(args: { ld_id: number }) {
    return this.dbObject.db.query.lends.findFirst({
      where: eq(lends.ld_id, args.ld_id),
      with: {
        installmentTimelines: {
          orderBy: asc(installmentTimelines.it_id),
          extras: {
            it_installment_date:
              sql`TO_CHAR(${installmentTimelines.it_installment_date},'dd/mm/yyyy')`.as(
                'it_installment_date',
              ),
          },
        },
      },
    });
  }

  // create lend
  async addLend(data: any) {
    return await this.dbObject.db.insert(lends).values(data).returning();
  }
  async updateLend(data: any, ld_id: number) {
    return await this.dbObject.db
      .update(lends)
      .set(data)
      .where(eq(lends.ld_id, Number(ld_id)))
      .returning();
  }
}
