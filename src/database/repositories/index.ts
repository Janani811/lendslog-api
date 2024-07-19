import { InstallmentTimelineRepository } from './InstallmentTimelines.repository';
import { LendsRepository } from './Lends.Repository';
import { UserRepository } from './User.repository';

export const repositories = [UserRepository, LendsRepository, InstallmentTimelineRepository];
