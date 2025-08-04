import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): Object {
    return {"message":"App is running","error":"null","statusCode":200};
  }
}
