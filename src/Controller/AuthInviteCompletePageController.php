<?php

namespace App\Controller;

use App\Auth\View\AuthViewPropsBuilder;
use App\Repository\InviteUserRepository;
use App\Security\CsrfTokenId;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/invite/complete/{token?}', name: 'auth_invite_complete_page', methods: ['GET'])]
final class AuthInviteCompletePageController extends AbstractController
{
    public function __construct(
        private readonly AuthViewPropsBuilder $viewPropsBuilder,
        private readonly InviteUserRepository $inviteUserRepository,
    ) {
    }

    public function __invoke(Request $request, ?string $token = null): Response
    {
        if ($token !== null) {
            $request->getSession()->set('invite_token', $token);

            return $this->redirectToRoute('auth_invite_complete_page');
        }

        $tokenInSession = (string) $request->getSession()->get('invite_token', '');
        $invitedEmail = null;
        $inviteAlreadyAccepted = false;

        if ($tokenInSession !== '') {
            $invite = $this->inviteUserRepository->findOneBy(['token' => $tokenInSession]);
            if ($invite !== null) {
                $invitedEmail = $invite->getEmail();
                $inviteAlreadyAccepted = $invite->isAccepted();
            }
        }

        $context = $this->viewPropsBuilder->build($request, [CsrfTokenId::INVITE_COMPLETE]);
        $props = $context['props'];
        $props['inviteToken'] = $tokenInSession;
        $props['invitedEmail'] = $invitedEmail;
        $props['inviteAlreadyAccepted'] = $inviteAlreadyAccepted;

        return $this->render('auth/invite_complete.html.twig', [
            'component_props' => $props,
            'theme_color' => $context['theme_color'],
            'theme_mode' => $context['theme_mode'],
        ]);
    }
}
