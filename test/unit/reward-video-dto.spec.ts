import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateRewardDto,
  UpdateRewardDto,
} from '../../src/rewards/dto/create-reward.dto';

const options = { enableImplicitConversion: true };

describe('reward video form data', () => {
  it('keeps false switches false in multipart requests', () => {
    const dto = plainToInstance(
      UpdateRewardDto,
      {
        isVideoShow: 'false',
        removeVideo: 'false',
        carryForward: 'false',
        isActive: 'false',
      },
      options,
    );
    expect(dto).toMatchObject({
      isVideoShow: false,
      removeVideo: false,
      carryForward: false,
      isActive: false,
    });
  });

  it('rejects invalid visibility/removal values rather than enabling videos', async () => {
    const dto = plainToInstance(
      UpdateRewardDto,
      { isVideoShow: 'yes', removeVideo: null },
      options,
    );
    expect((await validate(dto)).map((error) => error.property)).toEqual(
      expect.arrayContaining(['isVideoShow', 'removeVideo']),
    );
  });

  it('preserves custom daily allocations through multipart JSON', () => {
    const dto = plainToInstance(
      CreateRewardDto,
      { customDailyAllocations: '{"day-1":3}', isVideoShow: 'true' },
      options,
    );
    expect(dto.customDailyAllocations).toEqual({ 'day-1': 3 });
    expect(dto.isVideoShow).toBe(true);
  });
});
