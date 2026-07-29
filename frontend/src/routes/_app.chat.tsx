import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Building2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChatConversation, ChatMessage } from "@/lib/chat";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/chat")({ component: ChatPage });

const sensitiveMessagePattern =
  /\b(senha|password|senha\s*[:=]|token\s*[:=]|secret\s*[:=]|api[ _-]?key|chave\s*[:=]|pwd\s*[:=])\b/i;

function chatOnboardingKey(userId: string) {
  return `maker-wallet:chat-onboarding:${userId}`;
}

function hasSeenChatOnboarding(userId: string) {
  if (typeof window === "undefined") return false;
  try {
    // TODO: Persist this per-user preference in the backend when chat preferences are available.
    return window.localStorage.getItem(chatOnboardingKey(userId)) === "completed";
  } catch {
    return false;
  }
}

function conversationTitle(conversation: ChatConversation, currentUserId: string) {
  if (conversation.type === "ADMIN_SUPPORT") return "Administração";
  if (conversation.type === "ACCESS_REQUEST")
    return conversation.accessRequest?.subject ?? "Solicitação de acesso";
  return (
    conversation.participants.find((item) => item.userId !== currentUserId)?.user.name ??
    "Conversa direta"
  );
}

function conversationAvatar(conversation: ChatConversation, currentUserId: string) {
  return conversation.participants.find((item) => item.userId !== currentUserId)?.user;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );
}

function accessRequestLabel(status?: "OPEN" | "IN_PROGRESS" | "RESOLVED") {
  if (status === "RESOLVED") return "Concluída";
  if (status === "IN_PROGRESS") return "Em andamento";
  return "Aberta";
}

function ChatPage() {
  const {
    currentUser,
    isAdmin,
    listChatContacts,
    listConversations,
    getConversationMessages,
    startDirectConversation,
    startSupportConversation,
    sendConversationMessage,
    updateConversationRequest,
  } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [message, setMessage] = useState("");
  const [secureShareOpen, setSecureShareOpen] = useState(false);
  const [contacts, setContacts] = useState<Awaited<ReturnType<typeof listChatContacts>>>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);
  const filteredConversations = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalized || !currentUser) return conversations;
    return conversations.filter((conversation) =>
      conversationTitle(conversation, currentUser.id)
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [conversations, currentUser, search]);
  const filteredContacts = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return contacts;
    return contacts.filter((contact) =>
      contact.name.toLocaleLowerCase("pt-BR").includes(normalized),
    );
  }, [contacts, search]);

  const refreshConversations = useCallback(async () => {
    const result = await listConversations();
    setConversations(result);
    return result;
  }, [listConversations]);

  const refreshContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      setContacts(await listChatContacts());
    } finally {
      setContactsLoading(false);
    }
  }, [listChatContacts]);

  useEffect(() => {
    if (!currentUser) return;
    setShowOnboarding(hasSeenChatOnboarding(currentUser.id) ? false : true);
  }, [currentUser]);

  useEffect(() => {
    if (showOnboarding !== false) return;
    void (async () => {
      try {
        await Promise.all([refreshConversations(), refreshContacts()]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não foi possível carregar as conversas.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshContacts, refreshConversations, showOnboarding]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void (async () => {
      setLoadingMessages(true);
      try {
        const result = await getConversationMessages(selectedId);
        setMessages(result.messages);
        setConversations((previous) =>
          previous.map((item) => (item.id === selectedId ? result.conversation : item)),
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível abrir a conversa.");
        setSelectedId(undefined);
      } finally {
        setLoadingMessages(false);
      }
    })();
  }, [getConversationMessages, selectedId]);

  const selectCreatedConversation = async (
    conversation: ChatConversation,
    successMessage: string,
  ) => {
    setSelectedId(conversation.id);
    await refreshConversations();
    toast.success(successMessage);
  };

  const createDirect = async (participantId: string) => {
    setSubmitting(true);
    try {
      const conversation = await startDirectConversation(participantId);
      await selectCreatedConversation(conversation, "Conversa pronta para começar.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar a conversa.");
    } finally {
      setSubmitting(false);
    }
  };

  const createSupport = async (forAccessRequest = false) => {
    setSubmitting(true);
    try {
      const conversation = await startSupportConversation();
      await selectCreatedConversation(
        conversation,
        forAccessRequest
          ? "Converse com a administração para solicitar o acesso."
          : "A administração foi adicionada à conversa.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir a conversa com a administração.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!selectedId || !content) return;
    if (sensitiveMessagePattern.test(content)) {
      toast.warning(
        "Evite enviar senhas ou tokens no chat. Use o compartilhamento seguro quando ele estiver disponível.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const sent = await sendConversationMessage(selectedId, content);
      setMessages((previous) => [...previous, sent]);
      setMessage("");
      await refreshConversations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateRequestStatus = async (status: "OPEN" | "IN_PROGRESS" | "RESOLVED") => {
    if (!selectedId) return;
    try {
      await updateConversationRequest(selectedId, status);
      await refreshConversations();
      toast.success("Status da solicitação atualizado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar a solicitação.",
      );
    }
  };

  const completeOnboarding = () => {
    if (!currentUser || completingOnboarding) return;
    setCompletingOnboarding(true);
    try {
      // TODO: Replace this local preference with a protected backend chat-preferences endpoint.
      window.localStorage.setItem(chatOnboardingKey(currentUser.id), "completed");
    } catch {
      toast.message(
        "Você pode continuar. Não foi possível salvar esta preferência neste navegador.",
      );
    }
    window.setTimeout(() => {
      setShowOnboarding(false);
      setCompletingOnboarding(false);
    }, 180);
  };

  if (!currentUser) return null;

  if (showOnboarding === null) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center" aria-live="polite">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showOnboarding) {
    return <ChatWelcome onComplete={completeOnboarding} completing={completingOnboarding} />;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] min-h-[38rem] max-w-[92rem] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">CENTRAL DE CONVERSAS</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Chat
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Converse com pessoas autorizadas e acompanhe suas solicitações.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowOnboarding(true)}>
          <Sparkles /> Ver apresentação
        </Button>
      </div>

      <section className="wallet-card grid min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-border lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-border bg-card/35 lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="bg-background pl-9"
                placeholder="Buscar conversa"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex h-28 items-center justify-center text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <>
                {filteredConversations.length > 0 && (
                  <div className="mb-2">
                    <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Conversas
                    </p>
                    {filteredConversations.map((conversation) => {
                      const avatar = conversationAvatar(conversation, currentUser.id);
                      const preview = conversation.messages[0];
                      return (
                        <button
                          type="button"
                          key={conversation.id}
                          onClick={() => setSelectedId(conversation.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent",
                            selectedId === conversation.id && "bg-accent",
                          )}
                        >
                          {avatar ? (
                            <UserAvatar user={avatar} className="h-10 w-10 shrink-0" />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                              <Building2 className="h-4 w-4" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold">
                                {conversationTitle(conversation, currentUser.id)}
                              </span>
                              {conversation.unreadCount > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                                  {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {preview?.content ?? "Sem mensagens"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {contactsLoading ? (
                  <div className="flex h-20 items-center justify-center text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  </div>
                ) : filteredContacts.length > 0 ? (
                  <div>
                    <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Pessoas
                    </p>
                    {filteredContacts.map((contact) => (
                      <button
                        type="button"
                        key={contact.id}
                        disabled={submitting}
                        onClick={() => void createDirect(contact.id)}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent disabled:opacity-60"
                      >
                        <UserAvatar user={contact} className="h-10 w-10 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {contact.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contact.role === "ADMIN" ? "Administração" : "Usuário"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma pessoa autorizada encontrada.
                  </p>
                )}
              </>
            )}
          </div>
        </aside>

        <div className="relative flex min-h-0 flex-col bg-background/25">
          {!selectedConversation ? (
            <WelcomePanel
              onSupport={() => void createSupport()}
              onRequest={() => void createSupport(true)}
              submitting={submitting}
            />
          ) : (
            <>
              <header className="flex min-h-18 items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
                {conversationAvatar(selectedConversation, currentUser.id) ? (
                  <UserAvatar
                    user={conversationAvatar(selectedConversation, currentUser.id)}
                    className="h-10 w-10"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Building2 className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display font-semibold">
                    {conversationTitle(selectedConversation, currentUser.id)}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.type === "ADMIN_SUPPORT"
                      ? `${selectedConversation.participants.filter((participant) => participant.user.role === "ADMIN").length} conta(s) administrativa(s) neste grupo`
                      : selectedConversation.type === "ACCESS_REQUEST"
                        ? "Solicitação de acesso"
                        : "Canal protegido"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSecureShareOpen(true)}>
                  <LockKeyhole />{" "}
                  <span className="hidden sm:inline">Compartilhar com segurança</span>
                </Button>
              </header>
              {selectedConversation.accessRequest && (
                <div className="mx-4 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm sm:mx-6">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-semibold">
                    {selectedConversation.accessRequest.category}
                  </span>
                  <span className="text-muted-foreground">
                    · {accessRequestLabel(selectedConversation.accessRequest.status)}
                  </span>
                  {isAdmin && (
                    <select
                      aria-label="Status da solicitação"
                      className="ml-auto rounded-md border border-input bg-background px-2 py-1 text-xs"
                      value={selectedConversation.accessRequest.status}
                      onChange={(event) =>
                        void updateRequestStatus(
                          event.target.value as "OPEN" | "IN_PROGRESS" | "RESOLVED",
                        )
                      }
                    >
                      <option value="OPEN">Aberta</option>
                      <option value="IN_PROGRESS">Em andamento</option>
                      <option value="RESOLVED">Concluída</option>
                    </select>
                  )}
                </div>
              )}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageCircle className="h-8 w-8 text-primary" />
                    <p className="mt-3 font-medium">Ainda não há mensagens.</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Envie uma mensagem para iniciar esta conversa.
                    </p>
                  </div>
                ) : (
                  messages.map((item) => (
                    <MessageBubble
                      key={item.id}
                      message={item}
                      own={item.senderId === currentUser.id}
                    />
                  ))
                )}
              </div>
              <form onSubmit={submitMessage} className="border-t border-border p-3 sm:p-4">
                <div className="flex items-end gap-2 rounded-xl border border-input bg-card p-2 focus-within:ring-1 focus-within:ring-ring">
                  <Textarea
                    aria-label="Mensagem"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Escreva uma mensagem..."
                    className="min-h-10 max-h-28 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={submitting || !message.trim()}
                    aria-label="Enviar mensagem"
                  >
                    <Send />
                  </Button>
                </div>
                <p className="mt-2 px-1 text-xs text-muted-foreground">
                  Não envie senhas, tokens ou chaves neste chat.
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      <SecureShareDialog
        open={secureShareOpen}
        onOpenChange={setSecureShareOpen}
        conversation={selectedConversation}
        currentUserId={currentUser.id}
      />
    </div>
  );
}

function WelcomePanel({
  onSupport,
  onRequest,
  submitting,
}: {
  onSupport: () => void;
  onRequest: () => void;
  submitting: boolean;
}) {
  const [mascotVisible, setMascotVisible] = useState(true);
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex max-w-3xl flex-col items-center gap-7 lg:flex-row lg:text-left">
        <div className="flex h-52 w-52 shrink-0 items-center justify-center rounded-[2rem] bg-primary/8 p-3">
          {mascotVisible ? (
            <img
              src="/assets/images/chat-mascot.png"
              alt="Mascote da Central Maker Wallet"
              className="h-full w-full object-contain"
              onError={() => setMascotVisible(false)}
            />
          ) : (
            <UsersRound className="h-16 w-16 text-primary" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-primary">CENTRAL MAKER WALLET</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Conecte-se com sua equipe
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Converse com outros usuários, fale com a administração e solicite acesso a plataformas e
            sistemas com mais organização e segurança.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            <Button variant="outline" onClick={onSupport} disabled={submitting}>
              <Building2 /> Falar com a administração
            </Button>
            <Button variant="ghost" onClick={onRequest}>
              <KeyRound /> Solicitar acesso <ArrowUpRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, own }: { message: ChatMessage; own: boolean }) {
  return (
    <div className={cn("flex gap-2", own && "flex-row-reverse")}>
      <UserAvatar user={message.sender} className="mt-1 h-7 w-7 shrink-0" />
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2",
          own
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-card shadow-sm",
        )}
      >
        <div
          className={cn(
            "mb-1 flex gap-2 text-xs",
            own ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          <span className="font-semibold">{message.sender.name}</span>
          <time>{formatTime(message.createdAt)}</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.content}</p>
      </div>
    </div>
  );
}

function SecureShareDialog({
  open,
  onOpenChange,
  conversation,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation?: ChatConversation;
  currentUserId: string;
}) {
  const [context, setContext] = useState("");
  const recipient = conversation ? conversationTitle(conversation, currentUserId) : "destinatário";
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setContext("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar acesso com segurança</DialogTitle>
          <DialogDescription>
            Este fluxo não envia nem grava senhas. O cofre criptografado ainda precisa de um
            endpoint próprio no backend.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
          <div className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Não cole senhas, tokens, chaves ou códigos aqui. Use esta conversa para alinhar o
              contexto e solicite que o acesso seja concedido pelo cofre.
            </p>
          </div>
        </div>
        <div className="mt-1 space-y-4">
          <div className="space-y-2">
            <Label>Destinatário</Label>
            <Input value={recipient} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secure-context">Contexto do acesso</Label>
            <Textarea
              id="secure-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Ex.: acesso temporário ao ambiente de homologação"
            />
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" disabled title="Depende do endpoint de cofre criptografado">
            Cofre seguro em breve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
