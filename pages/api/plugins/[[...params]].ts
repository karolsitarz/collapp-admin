import {
  createHandler,
  Get,
  Patch,
  Param,
  NotFoundException,
  Query,
  ParseNumberPipe,
  BadRequestException,
  UnauthorizedException,
} from '@storyofams/next-api-decorators'
import { prisma } from 'shared/utils/prismaClient'
import { NextAuthGuard, RequestUser, User } from 'shared/utils/apiDecorators'
import { fetchWithPagination } from 'shared/utils/fetchWithPagination'
import { amazonUrl } from 'shared/utils/awsHelpers'

@NextAuthGuard()
class Plugins {
  @Get()
  async getPluginList(
    @Query('limit', ParseNumberPipe({ nullable: true })) limit?: number,
    @Query('page', ParseNumberPipe({ nullable: true })) page?: number,
    @Query('name') name?: string,
    // @Query('status') status?: string, // TODO: filter by status
  ) {
    return await fetchWithPagination('draftPlugin', limit, page, {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
    })
  }

  @Get('/:id')
  async getPlugin(@Param('id') id: string) {
    const plugin = await prisma.draftPlugin.findFirst({
      where: { id },
      include: {
        source: true,
        logs: {
          include: {
            admin: true,
          },
        },
      },
    })

    if (!plugin) {
      throw new NotFoundException('The plugin was not found.')
    }

    return plugin
  }

  @Patch('/:id/reject')
  async rejectPlugin(@Param('id') id: string, @User user: RequestUser) {
    const plugin = await prisma.draftPlugin.findFirst({
      where: { id },
    })

    if (!plugin) {
      throw new NotFoundException('The plugin was not found.')
    }
    if (!plugin.isPending) {
      throw new BadRequestException(`Only pending plugins can be rejected.`)
    }

    const admin = await prisma.adminUser.findFirst({
      where: { email: user.email },
    })

    if (!admin) {
      throw new UnauthorizedException('Only admins can reject plugins.')
    }

    return await prisma.draftPlugin.update({
      where: { id },
      data: {
        isPending: false,
        logs: {
          create: [
            {
              content: 'Rejected',
              admin: {
                connect: {
                  id: admin.id,
                },
              },
            },
          ],
        },
      },
    })
  }

  @Patch('/:id/accept')
  async acceptPlugin(@Param('id') id: string, @User user: RequestUser) {
    const plugin = await prisma.draftPlugin.findFirst({
      where: { id },
      include: {
        source: true,
        author: true,
      },
    })

    if (!plugin) {
      throw new NotFoundException('The plugin was not found.')
    }
    if (!plugin.isPending) {
      throw new BadRequestException(`Only pending plugins can be accepted.`)
    }
    if (plugin.isBuilding) {
      throw new BadRequestException(`Plugin is already being built.`)
    }
    if (!plugin.source) {
      throw new BadRequestException(`Plugin must have the source code.`)
    }

    const admin = await prisma.adminUser.findFirst({
      where: { email: user.email },
    })

    if (!admin) {
      throw new UnauthorizedException('Only admins can accept plugins.')
    }

    const pluginToBeBuilt = await prisma.draftPlugin.update({
      where: { id },
      data: {
        isBuilding: true,
        logs: {
          create: [
            {
              content: 'Accepted',
              admin: {
                connect: {
                  id: admin.id,
                },
              },
            },
          ],
        },
      },
      include: {
        source: true,
        author: true,
      },
    })

    fetch('https://collapp-build-server.herokuapp.com/build', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: id,
        name: pluginToBeBuilt.name,
        developer: {
          name: pluginToBeBuilt.author.name,
          email: pluginToBeBuilt.author.email,
        },
        zip: {
          url: amazonUrl + pluginToBeBuilt.source?.url,
        },
      }),
    })

    return pluginToBeBuilt
  }
}

export default createHandler(Plugins)
