import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.userModel.findOne({ email });
    if (existing) throw new UnauthorizedException('User already exists');

    const hashed = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, password: hashed, name });
    await user.save();
    return { message: 'Registration successful' };
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user._id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return { access_token: token };
  }

  async validateUser(payload: {
    sub: string;
    email: string;
  }): Promise<User | null> {
    return this.userModel.findById(payload.sub).select('-password');
  }
}
