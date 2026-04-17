import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    console.log({ createProductDto });
    const product = await this.prisma.product.create({
      data: createProductDto,
    });
    return product;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPages = await this.prisma.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalPages / limit);

    if (page > lastPage) throw new NotFoundException('No data found');

    return {
      data: await this.prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
      }),
      meta: {
        page,
        total: totalPages,
        lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, available: true },
    });

    if (!product)
      throw new NotFoundException(`Product with ID #${id} not found`);

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    if (!updateProductDto) throw new BadRequestException('No data to update');
    await this.findOne(id);

    const { id: _, ...data } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // HARD DELETE
  // async remove(id: number) {
  //   await this.findOne(id);

  //   return this.prisma.product.delete({ where: { id } });
  // }

  // SOFT DELETE
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: { available: false },
    });
  }
}
