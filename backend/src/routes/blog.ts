import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'
import { createBlogInput, updateBlogInput } from "@nishantparihar/wisdom-common";


const blog = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        jwt_secret: string
    },
    Variables: {
        userId: string,
    }
}>()


blog.use('/*', async (c, next) => {

    const jwt = c.req.header('authorization');
  
      if (!jwt) {
          c.status(403);
          return c.json({ error: "unauthorized" });
      }
  
      const token = jwt.split(' ')[1];
      const payload = await verify(token, c.env.jwt_secret);
    
      if (!payload) {
          c.status(403);
          return c.json({ error: "unauthorized" });
      }

      c.set('userId', String(payload.id));
      await next()
  })



blog.post('/', async (c) => {
    const body = await c.req.json()

    const { success } = createBlogInput.safeParse(body);

    if(!success){
      c.status(411);
      return c.json({
        msg: "Wrong Inputs"
      })
    }


    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());



    try{
        const res = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: c.get('userId')
            }
        })

        if(!res){
            c.status(411);
            return c.text("Error while posting")
        }

        c.status(202);
        return c.json({
            id: res.id
        })
    }
    catch(e){
        c.status(411);
        return c.text("Error while posting")
    }

})
  
  
blog.put('/', async (c) => {
    const body = await c.req.json()

    const { success } = updateBlogInput.safeParse(body);

    if(!success){
      c.status(411);
      return c.json({
        msg: "Wrong Inputs"
      })
    }


    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try{
        const res = await prisma.post.update({
            where: {
                id: body.id
            },
            data: {
                title: body.title,
                content: body.content,
                published: body.publsihed
            }
        })

        if(!res){
            c.status(411);
            return c.text("Error while posting")
        }

        c.status(202);
        return c.json({
            id: res.id
        })
    }
    catch(e){
        c.status(411);
        return c.text("Error while posting")
    }

})
  
// add pagination in future  
blog.get('/bulk',async (c)=>{

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());


    try{
        const res = await prisma.post.findMany({})

        if(!res){
            c.status(411);
            return c.text("Could not get the posts")
        }

        c.status(202);
        return c.json({
            blogs: res
        })
    }
    catch(e){
        c.status(411);
        return c.text("Error while getting posts")
    }

})
    
  
blog.get('/:id', async (c) => {

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const id = c.req.param('id')

    try{
        const res = await prisma.post.findFirst({
            where: {
                id
            },
        })

        if(!res){
            c.status(411);
            return c.text("Post with given id didn't")
        }
        
        c.status(202);
        return c.json({
            blog: res
        })
    }
    catch(e){
        c.status(411);
        return c.text("Error while searching post")
    }

})
  
  

export default blog;