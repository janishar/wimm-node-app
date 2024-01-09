import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';
import { TokensEntity } from './tokens.entity';
import { User } from '../../user/schemas/user.schema';

export class SignInEntity {
  user: UserEntity;
  roles: RoleEntity[];
  tokens: TokensEntity;

  constructor(user: User, tokens: TokensEntity) {
    this.user = new UserEntity(user);
    this.roles = user.roles.map((role) => new RoleEntity(role));
    this.tokens = tokens;
  }
}