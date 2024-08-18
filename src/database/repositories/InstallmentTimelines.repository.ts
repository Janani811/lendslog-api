import { Inject } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';

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
        it_term_amount: sql`ROUND(it_term_amount, 2)`,
      })
      .from(installmentTimelines)
      .innerJoin(lends, eq(installmentTimelines.it_lend_id, lends.ld_id))
      .where(
        sql`DATE(it_installment_date) <= CURRENT_DATE and it_installement_status = 1 and ld_lender_id = ${user_id} and it_is_deleted = 0`,
      );
    //     const { rows, rowCount } = await this.dbObject.db.execute(sql`SELECT
    //     trim(both ' ' from to_char(it_installment_date, 'Month')) || '-' || to_char(it_installment_date, 'YYYY') as month_year,
    //     json_agg(
    //         json_build_object(
    //             'it_id', it_id,
    //             'it_installment_date', to_char(it_installment_date, 'DD-MM-YYYY'),
    //             'it_installement_status', it_installement_status,
    //             'ld_id', ld_id,
    //             'ld_borrower_name', ld_borrower_name,
    //             'ld_borrower_phoneno', ld_borrower_phoneno,
    //             'it_term_amount', round(it_term_amount, 3),
    //             'it_order', it_order,
    //             'ld_payment_term', ld_payment_term
    //         )
    //     ) as installments
    // FROM installment_timeline
    // INNER JOIN lends ON installment_timeline.it_lend_id = lends.ld_id
    // WHERE
    //     DATE(it_installment_date) <= CURRENT_DATE
    //     AND it_installement_status = 1
    //     AND ld_lender_id = ${user_id}
    // GROUP BY
    //     trim(both ' ' from to_char(it_installment_date, 'Month')) || '-' || to_char(it_installment_date, 'YYYY'),
    //     to_char(it_installment_date, 'YYYY-MM')
    // ORDER BY
    //     to_char(it_installment_date, 'YYYY-MM') DESC;
    // `);
    //     return { rows, rowCount };
  }

  async updateByLendId(data: any, args: { it_lend_id: number; it_ids?: number[] }) {
    console.log(data, args);
    return await this.dbObject.db
      .update(installmentTimelines)
      .set(data)
      .where(
        and(
          eq(installmentTimelines.it_lend_id, Number(args.it_lend_id)),
          args?.it_ids.length && inArray(installmentTimelines.it_id, args.it_ids),
        ),
      )
      .returning();
  }
  // get specific pending Installment based on it_id
  async getOne(args: { it_id: number }) {
    return this.dbObject.db.query.installmentTimelines.findFirst({
      where: eq(installmentTimelines.it_id, args.it_id),
    });
  }
  async getInstallmentStatusCount(args: { ld_id: number; status: number }) {
    const result = await this.dbObject.db
      .select({
        count: sql`count(${installmentTimelines.it_id})`,
      })
      .from(installmentTimelines)
      .where(
        and(
          eq(installmentTimelines.it_installement_status, args.status),
          eq(installmentTimelines.it_lend_id, args.ld_id),
        ),
      )
      .groupBy(installmentTimelines.it_lend_id);

    // If the result is empty, return 0
    if (result.length === 0) {
      return 0;
    }

    // Return the count, assuming it will be the first item in the array
    return result[0]?.count ?? 0;
  }
}
