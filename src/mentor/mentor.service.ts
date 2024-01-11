import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Mentor } from './schemas/mentor.schema';
import { SubscriptionService } from '../subscription/subscription.service';
import { User } from '../user/schemas/user.schema';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';
import { MentorSubscriptionDto } from './dto/mentor-subsciption.dto';
import { MentorInfoDto } from './dto/mentor-info.dto';
import { PaginationDto } from '../common/pagination.dto';

@Injectable()
export class MentorService {
  constructor(
    @InjectModel(Mentor.name) private readonly mentorModel: Model<Mentor>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  INFO_PARAMETERS = '-description -status';

  async findMentorSubsciption(
    mentorId: Types.ObjectId,
    user: User,
  ): Promise<MentorSubscriptionDto> {
    const mentor = await this.findById(mentorId);
    if (!mentor) throw new NotFoundException('Mentor not found');

    const subscription =
      await this.subscriptionService.findSubscriptionForUser(user);

    const subscribedTopic = subscription?.topics.find((m) =>
      mentor._id.equals(m._id),
    );

    return new MentorSubscriptionDto(mentor, subscribedTopic !== undefined);
  }

  async create(admin: User, createMentorDto: CreateMentorDto): Promise<Mentor> {
    const created = await this.mentorModel.create({
      ...createMentorDto,
      createdBy: admin,
      updatedBy: admin,
    });
    return created.toObject();
  }

  async update(
    admin: User,
    mentorId: Types.ObjectId,
    updateMentorDto: UpdateMentorDto,
  ): Promise<Mentor | null> {
    const mentor = await this.findById(mentorId);
    if (!mentor) throw new NotFoundException('Mentor not found');

    return this.mentorModel
      .findByIdAndUpdate(
        mentor._id,
        {
          ...updateMentorDto,
          updatedBy: admin,
        },
        { new: true },
      )
      .lean()
      .exec();
  }

  async delete(mentorId: Types.ObjectId): Promise<Mentor | null> {
    const mentor = await this.findById(mentorId);
    if (!mentor) throw new NotFoundException('Mentor not found');
    return this.mentorModel
      .findByIdAndUpdate(mentor._id, { $set: { status: false } }, { new: true })
      .lean()
      .exec();
  }

  async findById(id: Types.ObjectId): Promise<Mentor | null> {
    return this.mentorModel.findOne({ _id: id, status: true }).lean().exec();
  }

  async findByIds(ids: Types.ObjectId[]): Promise<Mentor[]> {
    return this.mentorModel
      .find({ _id: { $in: ids }, status: true })
      .select(this.INFO_PARAMETERS)
      .lean()
      .exec();
  }

  async findMentorsPaginated(
    paginationDto: PaginationDto,
  ): Promise<MentorInfoDto[]> {
    const mentors = await this.mentorModel
      .find({ status: true })
      .skip(paginationDto.pageItemCount * (paginationDto.pageNumber - 1))
      .limit(paginationDto.pageItemCount)
      .select(this.INFO_PARAMETERS)
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    return mentors.map((mentor) => new MentorInfoDto(mentor));
  }

  async search(query: string, limit: number): Promise<MentorInfoDto[]> {
    const mentors = await this.mentorModel
      .find({
        $text: { $search: query, $caseSensitive: false },
        status: true,
      })
      .select(this.INFO_PARAMETERS)
      .limit(limit)
      .lean()
      .exec();
    return mentors.map((mentor) => new MentorInfoDto(mentor));
  }

  async searchLike(query: string, limit: number): Promise<MentorInfoDto[]> {
    const mentors = await this.mentorModel
      .find()
      .and([
        { status: true },
        {
          $or: [
            { name: { $regex: `.*${query}.*`, $options: 'i' } },
            { occupation: { $regex: `.*${query}.*`, $options: 'i' } },
            { title: { $regex: `.*${query}.*`, $options: 'i' } },
          ],
        },
      ])
      .select(this.INFO_PARAMETERS)
      .limit(limit)
      .lean()
      .exec();
    return mentors.map((mentor) => new MentorInfoDto(mentor));
  }

  async findRecommendedMentors(limit: number): Promise<MentorInfoDto[]> {
    const mentors = await this.mentorModel
      .find({ status: true })
      .limit(limit)
      .select(this.INFO_PARAMETERS)
      .sort({ score: -1 })
      .lean()
      .exec();
    return mentors.map((mentor) => new MentorInfoDto(mentor));
  }

  async findRecommendedMentorsPaginated(
    paginationDto: PaginationDto,
  ): Promise<MentorInfoDto[]> {
    const mentors = await this.mentorModel
      .find({ status: true })
      .skip(paginationDto.pageItemCount * (paginationDto.pageNumber - 1))
      .limit(paginationDto.pageItemCount)
      .select(this.INFO_PARAMETERS)
      .sort({ score: -1 })
      .lean()
      .exec();
    return mentors.map((mentor) => new MentorInfoDto(mentor));
  }
}
