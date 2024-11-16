import { useNavigate } from "react-router-dom";
import { MdEmail, MdLock } from 'react-icons/md';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { api } from '../../services/api';
import { useForm } from "react-hook-form";

import { Container, Title, Column, TitleLogin, SubtitleLogin, EsqueciText, CriarText, Row, Wrapper } from './styles';

const Login = () => {
    const navigate = useNavigate();
    const { control, handleSubmit, formState: { errors } } = useForm({
        reValidateMode: 'onChange',
        mode: 'onChange',
    });

    // Função para verificar se o bloqueio está ativo
    const checkBlockStatus = () => {
        const blockTime = localStorage.getItem("blockTime");
        if (blockTime) {
            const remainingTime = new Date(blockTime) - new Date();
            return remainingTime > 0 ? remainingTime : 0;
        }
        return 0;
    };

    // Função para controlar as tentativas de login
    const handleLoginAttempts = () => {
        const attempts = parseInt(localStorage.getItem("loginAttempts")) || 0;
        const remainingBlockTime = checkBlockStatus();

        if (remainingBlockTime > 0) {
            return { blocked: true, remainingTime: remainingBlockTime };
        }

        return { blocked: false, attempts };
    };

    // Função de login
    const onSubmit = async (formData) => {
        const { blocked, attempts, remainingTime } = handleLoginAttempts();

        if (blocked) {
            alert(`Você está bloqueado. Tente novamente em ${Math.ceil(remainingTime / 1000 / 60)} minutos.`);
            return;
        }

        try {
            const { data } = await api.get(`/users?email=${formData.email}&senha=${formData.senha}`);

            if (data.length && data[0].id) {
                // Resetar tentativas em caso de sucesso
                localStorage.removeItem("loginAttempts");
                navigate('/feed');
                return;
            }

            alert('Usuário ou senha inválido');

            // Incrementar tentativas
            const newAttempts = attempts + 1;
            localStorage.setItem("loginAttempts", newAttempts);

            // Se atingir 3 tentativas, bloquear por 30 minutos
            if (newAttempts >= 3) {
                const blockUntil = new Date(new Date().getTime() + 30 * 60 * 1000); // 30 minutos
                localStorage.setItem("blockTime", blockUntil);
            }
        } catch (e) {
            alert("Erro ao tentar realizar o login.");
        }
    };

    const { blocked, remainingTime } = handleLoginAttempts();

    return (
        <>
            <Header />
            <Container>
                <Column>
                    <Title>A plataforma para você aprender com experts, dominar as principais tecnologias
                     e entrar mais rápido nas empresas mais desejadas.</Title>
                </Column>
                <Column>
                    <Wrapper>
                        <TitleLogin>Faça seu cadastro</TitleLogin>
                        <SubtitleLogin>Faça seu login e make the change._</SubtitleLogin>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Input placeholder="E-mail" leftIcon={<MdEmail />} name="email" control={control} />
                            {errors.email && <span>E-mail é obrigatório</span>}
                            <Input type="password" placeholder="Senha" leftIcon={<MdLock />} name="senha" control={control} />
                            {errors.senha && <span>Senha é obrigatório</span>}
                            <Button title="Entrar" variant="secondary" type="submit" disabled={blocked} />
                        </form>
                        <Row>
                            <EsqueciText>Esqueci minha senha</EsqueciText>
                            <CriarText>Criar Conta</CriarText>
                        </Row>
                    </Wrapper>
                </Column>
            </Container>
            {blocked && (
                <div>
                    <p>Você excedeu o número de tentativas. Aguarde <strong>{Math.ceil(remainingTime / 1000 / 60)} minutos</strong> para tentar novamente.</p>
                </div>
            )}
        </>
    );
};

export { Login };
