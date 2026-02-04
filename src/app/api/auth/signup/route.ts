import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signupSchema } from '@/lib/validations/auth';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = signupSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(err => ({
        field: err.path[0],
        message: err.message
      }));
      
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: errorMessages 
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}