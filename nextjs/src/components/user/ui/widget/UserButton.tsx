"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, Authenticated, Unauthenticated } from "convex/react";
import { Avatar } from "@skeletonlabs/skeleton-react";

import { api } from "@/convex/_generated/api";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/primitives/ui/Popover";
import { Modal, ModalContent } from "@/components/primitives/ui/Modal";

import ProfileInfo from "@/components/user/ui/widget/ProfileInfo";

export default function UserButton() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.user.getUser);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <Authenticated>
        {user ? (
          <>
            <Popover open={open} onOpenChange={setOpen} placement="bottom-end">
              <PopoverTrigger onClick={() => setOpen((v) => !v)}>
                <Avatar src={user.image} name={user.name} size="size-10" />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverDescription>
                  <ul role="list" className="space-y-1">
                    <li>
                      <div className="rounded-base text-surface-700-300 border-surface-700-300 flex gap-x-3 p-4 text-sm/6 font-semibold">
                        <Avatar
                          src={user.image}
                          name={user.name}
                          size="size-10"
                        />
                        <div className="flex max-w-90 flex-col gap-3">
                          <div className="flex-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm">{user.email}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="btn preset-outlined-surface-500"
                              onClick={() => {
                                setOpen(false);
                                setProfileOpen(true);
                              }}
                            >
                              Manage account
                            </button>

                            <button
                              className="btn preset-outlined-surface-500"
                              onClick={() => void signOut()}
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </PopoverDescription>
              </PopoverContent>
            </Popover>

            {/* ProfileInfo Popup */}
            <Modal open={profileOpen} onOpenChange={setProfileOpen}>
              <ModalContent>
                <div className="flex justify-between items-center mb-4">
                  <ProfileInfo />
                  <button
                    className="btn preset-ghost size-sm"
                    onClick={() => setProfileOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              </ModalContent>
            </Modal>

            <div className="relative">
              <button
                className="btn preset-filled-primary-500"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <div className="placeholder-circle size-10 animate-pulse" />
        )}
      </Authenticated>
      <Unauthenticated>
        <a href="/login" className="btn preset-filled-primary-500">
          Sign in
        </a>
      </Unauthenticated>
    </>
  );
}
