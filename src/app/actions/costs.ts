/**
 * @deprecated This file has been replaced by costs-migrated.ts which uses EntityService.
 * Please use the migrated version for all new development.
 * Migration guide: /MIGRATION_GUIDE.md
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCostsEventTypes() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return prisma.costs_event_type.findMany({
    where: {
      user_id: user.id,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export async function createCostEventType(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const eventType = await prisma.costs_event_type.create({
      data: {
        name: name.trim(),
        user_id: user.id,
      },
    });

    revalidatePath("/dashboard/costs");
    return { success: true, data: eventType };
  } catch (error) {
    console.error("Failed to create cost event type:", error);
    return { error: "Failed to create cost event type" };
  }
}

export async function updateCostEventType(id: string, name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await prisma.costs_event_type.update({
      where: {
        id,
        user_id: user.id,
      },
      data: {
        name: name.trim(),
      },
    });

    revalidatePath("/dashboard/costs");
    return { success: true };
  } catch (error) {
    console.error("Failed to update cost event type:", error);
    return { error: "Failed to update cost event type" };
  }
}

export async function deleteCostEventType(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Check if there are costs associated with this event type
    const costsCount = await prisma.costs.count({
      where: {
        costs_event_type_id: id,
        user_id: user.id,
      },
    });

    if (costsCount > 0) {
      return { error: "Cannot delete event type with associated costs" };
    }

    await prisma.costs_event_type.delete({
      where: {
        id,
        user_id: user.id,
      },
    });

    revalidatePath("/dashboard/costs");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete cost event type:", error);
    return { error: "Failed to delete cost event type" };
  }
}

export async function getCostsWithEventTypes(bookId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const costs = await prisma.costs.findMany({
    where: {
      user_id: user.id,
      ...(bookId && { book_id: bookId }),
    },
    include: {
      costs_event_type: true,
      book: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Convert Decimal to number for client components
  return costs.map((cost) => ({
    ...cost,
    amount: cost.amount.toNumber(),
  }));
}

export async function createCost(data: {
  bookId: string;
  eventTypeId: string;
  amount: number;
  date: string;
  details?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const cost = await prisma.costs.create({
      data: {
        user_id: user.id,
        book_id: data.bookId,
        costs_event_type_id: data.eventTypeId,
        amount: data.amount,
        date: new Date(data.date),
        details_message: data.details,
      },
    });

    // Convert Decimal to number for client components
    const serializedCost = {
      ...cost,
      amount: cost.amount.toNumber()
    };

    revalidatePath("/dashboard/costs");
    return { success: true, data: serializedCost };
  } catch (error) {
    console.error("Failed to create cost:", error);
    return { error: "Failed to create cost" };
  }
}

export async function updateCost(
  id: string,
  data: {
    eventTypeId: string;
    amount: number;
    date: string;
    details?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await prisma.costs.update({
      where: {
        id,
        user_id: user.id,
      },
      data: {
        costs_event_type_id: data.eventTypeId,
        amount: data.amount,
        date: new Date(data.date),
        details_message: data.details,
      },
    });

    revalidatePath("/dashboard/costs");
    return { success: true };
  } catch (error) {
    console.error("Failed to update cost:", error);
    return { error: "Failed to update cost" };
  }
}

export async function deleteCost(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await prisma.costs.delete({
      where: {
        id,
        user_id: user.id,
      },
    });

    revalidatePath("/dashboard/costs");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete cost:", error);
    return { error: "Failed to delete cost" };
  }
}
