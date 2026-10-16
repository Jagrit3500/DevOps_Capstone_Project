import asyncio

import app.main as main_module


def test_demo_data_is_disabled_by_default(monkeypatch):
    calls = []
    monkeypatch.delenv("SEED_DEMO_DATA", raising=False)
    monkeypatch.setattr(main_module, "_seed_data", lambda: calls.append("seeded"))

    async def start():
        async with main_module.lifespan(main_module.app):
            pass

    asyncio.run(start())
    assert calls == []


def test_demo_data_can_be_enabled(monkeypatch):
    calls = []
    monkeypatch.setenv("SEED_DEMO_DATA", "true")
    monkeypatch.setattr(main_module, "_seed_data", lambda: calls.append("seeded"))

    async def start():
        async with main_module.lifespan(main_module.app):
            pass

    asyncio.run(start())
    assert calls == ["seeded"]
